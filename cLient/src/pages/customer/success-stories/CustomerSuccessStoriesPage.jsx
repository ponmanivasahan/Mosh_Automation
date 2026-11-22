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
      <div className="css-container">
        {/* Header Section matching Image 2 */}
        <div className="css-header-section">
          <div className="css-header-title-row">
            <span className="css-accent-bar"></span>
            <h1 className="css-main-heading">Success Stories</h1>
          </div>
          <p className="css-subheading">
            Discover real success stories from customers who transformed their operations, saved time, and improved process reliability.
          </p>
        </div>

        <div className="story-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stories.map((story) => (
            <article key={story.id} className="story-card bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div>
                <img className="story-image w-full h-48 object-cover rounded-xl border border-slate-100" src={story.image} alt={story.title} />
                <div className="story-body mt-4 space-y-2">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Customer success</span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{story.title}</h3>
                  <p className="story-subtitle text-xs text-blue-600 font-bold">{story.subtitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{story.description}</p>
                  
                  {/* Social media links if present */}
                  <div className="flex gap-3 pt-2">
                    {story.youtubeUrl && (
                      <a href={story.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline">
                        Watch on YouTube
                      </a>
                    )}
                    {story.instagramUrl && (
                      <a href={story.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-pink-600 hover:text-pink-700 font-bold underline">
                        View Reels on Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default CustomerSuccessStoriesPage;
