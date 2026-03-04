import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
}

export function ToolCard({ title, description, icon: Icon, onClick, disabled = false }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative bg-card border border-border rounded-xl p-6 text-left transition-all duration-300 w-full',
        'hover:border-primary/30 hover:shadow-lg hover:-translate-y-1',
        disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
        <ArrowRight className={cn(
          'w-5 h-5 text-muted-foreground flex-shrink-0 transition-all duration-300',
          'group-hover:text-foreground group-hover:translate-x-1'
        )} />
      </div>
    </button>
  );
}
