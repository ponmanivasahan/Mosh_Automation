const { pool } = require('../config/db');

const getStories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stories ORDER BY created_at DESC');
    const formatted = rows.map(s => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      description: s.description,
      image: s.image,
      youtubeUrl: s.youtube_url,
      instagramUrl: s.instagram_url,
      createdAt: s.created_at
    }));
    return res.json({ success: true, stories: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve success stories.', error: error.message });
  }
};

const createStory = async (req, res) => {
  try {
    const { id, title, subtitle, description, image, youtubeUrl, instagramUrl } = req.body;

    if (!id || !title || !description || !image) {
      return res.status(400).json({ success: false, message: 'Please provide all required story fields.' });
    }

    const [result] = await pool.query(
      'INSERT INTO stories (id, title, subtitle, description, image, youtube_url, instagram_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, subtitle || '', description, image, youtubeUrl || '', instagramUrl || '']
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Unable to save success story. Please try again.' });
    }

    return res.status(201).json({ success: true, message: 'Success story created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create success story.', error: error.message });
  }
};

const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, image, youtubeUrl, instagramUrl } = req.body;

    const [result] = await pool.query(
      'UPDATE stories SET title = ?, subtitle = ?, description = ?, image = ?, youtube_url = ?, instagram_url = ? WHERE id = ?',
      [title, subtitle || '', description, image, youtubeUrl || '', instagramUrl || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Success story not found.' });
    }

    return res.json({ success: true, message: 'Success story updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update success story.', error: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM stories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Success story not found.' });
    }
    return res.json({ success: true, message: 'Success story deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete success story.', error: error.message });
  }
};

module.exports = {
  getStories,
  createStory,
  updateStory,
  deleteStory
};
