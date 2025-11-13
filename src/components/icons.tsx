
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <div className={cn("flex items-center justify-center font-headline font-bold", className)} {...props}>
        <span className="text-lg">j</span>
        <span className="text-4xl">T</span>
        <span className="text-lg">n</span>
    </div>
  );
}

export function UserCog(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <circle cx="18" cy="15" r="3" />
            <circle cx="9" cy="7" r="4" />
            <path d="M12 17.5V22" />
            <path d="M9 13c-2.5 2-5 5.5-5 5.5" />
            <path d="M15 17.5V22" />
            <path d="m21 16-1.7-1.7" />
            <path d="m15 14 1.7 1.7" />
            <path d="M18 12v-1.5" />
        </svg>
    )
}
