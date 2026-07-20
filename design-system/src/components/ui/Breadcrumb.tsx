import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
const Breadcrumb = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) =>
  <nav ref={ref} aria-label="breadcrumb" className={className} {...props} />

);
Breadcrumb.displayName = 'Breadcrumb';
const BreadcrumbList = forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) =>
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props} />

);
BreadcrumbList.displayName = 'BreadcrumbList';
const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) =>
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props} />

);
BreadcrumbItem.displayName = 'BreadcrumbItem';
const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) =>
  <a
    ref={ref}
    className={cn('transition-colors hover:text-foreground', className)}
    {...props} />

);
BreadcrumbLink.displayName = 'BreadcrumbLink';
const BreadcrumbPage = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) =>
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('font-normal text-foreground', className)}
    {...props} />

);
BreadcrumbPage.displayName = 'BreadcrumbPage';
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) =>
<li
  role="presentation"
  aria-hidden="true"
  className={cn('[&>svg]:size-3.5', className)}
  {...props}>
  
    {children ?? <ChevronRight />}
  </li>;

BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator };