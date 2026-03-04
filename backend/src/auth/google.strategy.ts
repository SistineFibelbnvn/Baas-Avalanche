import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly prisma: PrismaService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<any> {
        const { emails, displayName } = profile;
        const email = emails?.[0]?.value;

        if (!email) {
            return done(new Error('No email in Google profile'), undefined);
        }

        // Find or create user
        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Auto-create user from Google profile
            // Generate a random password since they're using OAuth
            const randomPassword = await bcrypt.hash(
                Math.random().toString(36).slice(-12),
                10,
            );

            user = await this.prisma.user.create({
                data: {
                    email,
                    name: displayName || email.split('@')[0],
                    password: randomPassword,
                },
            });
        }

        const { password, ...result } = user;
        done(null, result);
    }
}
