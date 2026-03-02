import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Req() req: any) {
        return req.user;
    }

    // Google OAuth: Step 1 - Redirect to Google
    @UseGuards(AuthGuard('google'))
    @Get('google')
    googleAuth() {
        // Guard redirects to Google
    }

    // Google OAuth: Step 2 - Google redirects back here
    @UseGuards(AuthGuard('google'))
    @Get('google/callback')
    async googleCallback(@Req() req: any, @Res() res: any) {
        // req.user was set by GoogleStrategy.validate()
        const jwt = await this.authService.issueTokenForOAuthUser(req.user);
        // Redirect to frontend with token in query string
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?token=${jwt.access_token}&user=${encodeURIComponent(JSON.stringify(jwt.user))}`);
    }
}
