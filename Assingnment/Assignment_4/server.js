import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'requests.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Safe file write helper
async function writeRequests(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Read or initialize JSON storage
async function readRequests() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeRequests([]);
      return [];
    }
    throw err;
  }
}

// GET /api/requests
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await readRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests' });
  }
});

// GET /api/requests/:id
app.get('/api/requests/:id', async (req, res) => {
  try {
    const requests = await readRequests();
    const item = requests.find((r) => r.id === parseInt(req.params.id, 10));
    if (!item) return res.status(404).json({ error: 'Request not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// POST /api/requests
app.post('/api/requests', async (req, res) => {
  try {
    const { name, email, category, description, priority } = req.body;
    if (!name || !email || !category || !description || !priority) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const requests = await readRequests();
    const newRequest = {
      id: Date.now(),
      name,
      email,
      category,
      description,
      priority,
      status: 'Open'
    };

    requests.push(newRequest);
    await writeRequests(requests);
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save request' });
  }
});

// PUT /api/requests/:id
app.put('/api/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const requests = await readRequests();
    const index = requests.findIndex((r) => r.id === id);

    if (index === -1) return res.status(404).json({ error: 'Request not found' });

    requests[index] = { ...requests[index], ...req.body, id };
    await writeRequests(requests);
    res.json(requests[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// DELETE /api/requests/:id
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let requests = await readRequests();
    const filtered = requests.filter((r) => r.id !== id);

    if (requests.length === filtered.length) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await writeRequests(filtered);
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});