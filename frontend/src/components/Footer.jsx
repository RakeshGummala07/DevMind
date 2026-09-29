import { Link } from 'react-router-dom';

export const GRIEVANCE_EMAIL = 'www.devmind@gmail.com';

export default function Footer() {
    return (
        <footer
            style={{
                padding: '1.5rem', fontSize: '0.85rem', opacity: 0.75,
                display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center',
            }}
        >
            <Link to="/privacy">Privacy Notice</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/data-rights">Data Rights Request</Link>
            <span>
        Grievance Officer: <a href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a>
      </span>
        </footer>
    );
}