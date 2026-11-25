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
    console.error('getStories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve success stories.' });
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
      [
        String(id).slice(0, 50),
        String(title).slice(0, 200),
        (subtitle || '').slice(0, 200),
        (description || '').slice(0, 2000),
        String(image),
        (youtubeUrl || '').slice(0, 500),
        (instagramUrl || '').slice(0, 500)
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Unable to save success story. Please try again.' });
    }

    return res.status(201).json({ success: true, message: 'Success story created successfully.' });
  } catch (error) {
    console.error('createStory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create success story.' });
  }
};

const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, image, youtubeUrl, instagramUrl } = req.body;

    const [result] = await pool.query(
      'UPDATE stories SET title = ?, subtitle = ?, description = ?, image = ?, youtube_url = ?, instagram_url = ? WHERE id = ?',
      [
        String(title).slice(0, 200),
        (subtitle || '').slice(0, 200),
        (description || '').slice(0, 2000),
        String(image),
        (youtubeUrl || '').slice(0, 500),
        (instagramUrl || '').slice(0, 500),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Success story not found.' });
    }

    return res.json({ success: true, message: 'Success story updated successfully.' });
  } catch (error) {
    console.error('updateStory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update success story.' });
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
    console.error('deleteStory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete success story.' });
  }
};

module.exports = {
  getStories,
  createStory,
  updateStory,
  deleteStory
};
