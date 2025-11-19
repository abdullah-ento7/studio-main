
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 80" 
        className={cn("font-sans font-bold", className)} 
        {...props}
    >
        <text x="10" y="60" className="text-8xl">J</text>
        <text x="60" y="60" className="text-8xl">T</text>
        <text x="110" y="60" className="text-8xl">N</text>
    </svg>
  );
}
