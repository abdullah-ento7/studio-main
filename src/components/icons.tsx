
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 50" 
        className={cn("font-headline font-bold", className)} 
        {...props}
    >
        <text x="10" y="40" className="text-5xl">j</text>
        <text x="40" y="45" className="text-7xl">T</text>
        <text x="80" y="40" className="text-5xl">n</text>
    </svg>
  );
}
