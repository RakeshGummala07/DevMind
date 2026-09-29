export default function PageHeader({ title, description, actions, as: Tag = 'h1', mono = false }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <Tag className={mono ? 'mono' : undefined}>{title}</Tag>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
