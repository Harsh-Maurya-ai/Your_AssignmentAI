const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignment');
const exportRoutes = require('./routes/export');
const paraphraseRoutes = require('./routes/paraphrase');
const grammarRoutes = require('./routes/grammar');
const citationRoutes = require('./routes/citation');
const codeExplainerRoutes = require('./routes/codeExplainer');
const codeDebuggerRoutes = require('./routes/codeDebugger');
const pseudocodeRoutes = require('./routes/pseudocode');
const labManualRoutes = require('./routes/labManual');
const readmeGeneratorRoutes = require('./routes/readmeGenerator');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/paraphrase', paraphraseRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/citation', citationRoutes);
app.use('/api/code-explainer', codeExplainerRoutes);
app.use('/api/code-debugger', codeDebuggerRoutes);
app.use('/api/pseudocode', pseudocodeRoutes);
app.use('/api/lab-manual', labManualRoutes);
app.use('/api/readme', readmeGeneratorRoutes);
app.use('/api/viva', require('./routes/viva'));
app.use('/api/summarizer', require('./routes/summarizer'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/flashcards', require('./routes/flashcards'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));