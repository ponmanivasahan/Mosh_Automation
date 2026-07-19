import { useState, useEffect } from 'react';
import AppShell from '../../../components/AppShell';
import { customerLinks } from '../../../utils/customerLinks';
import { getStories } from '../../../utils/storage';
import './CustomerSuccessStoriesPage.css';

const CustomerSuccessStoriesPage = () => {
  const [stories, setStories] = useState(() => getStories());

  useEffect(() => {
    const syncStories = () => {
      setStories(getStories());
    };
    const interval = setInterval(syncStories, 1500);
    window.addEventListener('storage', syncStories);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncStories);
    };
  }, []);

  return (
    <AppShell title="Success Stories" links={customerLinks}>
      <section className="panel customer-success-stories-page bg-slate-100 p-6 rounded-lg border border-slate-200">
        <div className="story-hero mb-6">
          <div>
            <p className="eyebrow text-teal-700 uppercase tracking-wider text-[10px] font-bold">Featured case studies</p>
            <h2 className="text-xl font-bold text-slate-800">How our customers are winning with automation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Discover real success stories from customers who transformed their operations, saved time,
              and improved process reliability.
            </p>
          </div>
        </div>

        <div className="story-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stories.map((story) => (
            <article key={story.id} className="story-card bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <img className="story-image w-full h-40 object-cover rounded-lg border" src={story.image} alt={story.title} />
                <div className="story-body mt-4 space-y-2">
                  <span className="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase">Customer success</span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{story.title}</h3>
                  <p className="story-subtitle text-xs text-slate-400 font-bold">{story.subtitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">{story.description}</p>
                  
                  {/* Social media links if present */}
                  <div className="flex gap-3 pt-2">
                    {story.youtubeUrl && (
                      <a href={story.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline">
                        Watch on YouTube
                      </a>
                    )}
                    {story.instagramUrl && (
                      <a href={story.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-600 hover:text-pink-700 font-bold underline">
                        View Reels on Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default CustomerSuccessStoriesPage;
