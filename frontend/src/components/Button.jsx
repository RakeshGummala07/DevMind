import { Link } from 'react-router-dom';
import { m } from './Motion.jsx';

/**
 * variant: primary | secondary | ghost | danger
 * size:    md | sm
 * Pass `to` to render a router link styled as a button.
 * `loading` disables the control, sets aria-busy and shows a spinner.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  style,
  className = '',
  loading = false,
  disabled = false,
  block = false,
  icon: Icon,
  to,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : Icon ? <Icon size={size === 'sm' ? 14 : 16} stroke={1.9} aria-hidden="true" /> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} style={style} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <m.button
      type={type}
      onClick={onClick}
      whileTap={disabled || loading ? undefined : { scale: 0.975 }}
      transition={{ duration: 0.12 }}
      className={classes}
      style={style}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </m.button>
  );
}
