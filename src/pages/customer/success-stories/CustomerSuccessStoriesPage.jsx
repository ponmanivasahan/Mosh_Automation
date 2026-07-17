import AppShell from '../../../components/AppShell';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerSuccessStoriesPage.css';

const stories = [
  {
    id: 's-1',
    title: 'Smart Water Control for a Growing Home',
    subtitle: 'Automated tank management built for reliability',
    description:
      'Homeowners reduced manual monitoring by 90% after installing the Auto Change Water Level Controller across twin tank setups.',
    image: '/Auto_Change_WaterLevel_Controller.png'
  },
  {
    id: 's-2',
    title: 'Dependable GSM Automation in Rural Installations',
    subtitle: 'Safe dry-run protection with remote access',
    description:
      'Rural pumping systems now run unattended with GSM-based control and dry-run prevention for consistent uptime.',
    image: '/GSM_Based_On-Off_With_Dry-run.png'
  },
  {
    id: 's-3',
    title: 'High-capacity Three-Phase Control for Industry',
    subtitle: 'Scaling automation for heavy workloads',
    description:
      'Large facilities improved efficiency and cut maintenance response time by adopting the three phase fully automatic controller.',
    image: '/Three_Phase_Fully_Automatic_Controller.png'
  }
];

const CustomerSuccessStoriesPage = () => (
  <AppShell title="Success Stories" links={customerLinks}>
    <section className="panel customer-success-stories-page">
      <div className="story-hero">
        <div>
          <p className="eyebrow">Featured case studies</p>
          <h2>How our customers are winning with automation</h2>
          <p>
            Discover real success stories from customers who transformed their operations, saved time,
            and improved process reliability.
          </p>
        </div>
      </div>

      <div className="story-grid">
        {stories.map((story) => (
          <article key={story.id} className="story-card">
            <img className="story-image" src={story.image} alt={story.title} />
            <div className="story-body">
              <p className="eyebrow">Customer success</p>
              <h3>{story.title}</h3>
              <p className="story-subtitle">{story.subtitle}</p>
              <p>{story.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  </AppShell>
);

export default CustomerSuccessStoriesPage;
