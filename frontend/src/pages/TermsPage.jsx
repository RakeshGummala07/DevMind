import PageContainer from '../components/PageContainer.jsx';

export default function TermsPage() {
    return (
        <PageContainer>
            <h1>Terms of Service</h1>


            <h2>Data Protection</h2>
            <p>
                We process your personal data, and any repository data you connect, in accordance with our{' '}
                <a href="/privacy">Privacy Notice</a> and the Digital Personal Data Protection Act, 2023.
                By creating an account or connecting a repository, you confirm that you have the right to
                share any repository content you provide, including where that content may contain personal
                data of third parties (e.g. commit author names/emails, code comments). You are responsible
                for ensuring your use of the Service complies with any obligations you owe to those third
                parties.
            </p>
            <p>
                We will not sell your personal data. We do not share repository content with third parties
                except as necessary to provide the Service or as required by law.
            </p>
            
        </PageContainer>
    );
}