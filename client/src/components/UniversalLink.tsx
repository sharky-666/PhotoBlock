import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';

interface UniversalLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
}

function isExternal(to: string): boolean {
  return /^(?:https?:|mailto:|tel:)/i.test(to);
}

export function UniversalLink({
  to,
  children,
  onClick,
  ...props
}: UniversalLinkProps) {
  if (isExternal(to) || props.target) {
    return (
      <a {...props} href={to} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link
      {...props}
      to={to as To}
      onClick={(event: MouseEvent<HTMLAnchorElement>) =>
        onClick?.(event)
      }
    >
      {children}
    </Link>
  );
}
