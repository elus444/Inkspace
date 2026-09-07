import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../api/axios';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import AIAssistPanel from '../components/AIAssistPanel';

const easeEditorial = [0.22, 1, 0.36, 1] as const;

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await postApi.post('/', { title, content });
      navigate('/');
    } catch (err) {
      setError('Failed to create post.');
      console.error(err);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeEditorial }}
        className="rounded-2xl border border-border-warm bg-cream p-8 shadow-warm-sm sm:p-10 lg:col-span-3"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-taupe">New story</p>
        <h2 className="mb-8 font-display text-3xl italic text-ink">Write something worth savoring.</h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-2 rounded-lg bg-maroon/10 px-3 py-2.5 text-sm text-maroon-dark"
            >
              <FiAlertTriangle />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="mb-6 border-b border-border-warm pb-4">
            <input
              type="text"
              id="title"
              placeholder="Your title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-0 bg-transparent p-0 font-display text-3xl italic text-ink placeholder:text-taupe/50 focus:outline-none focus:ring-0"
              required
            />
          </div>

          <div className="mb-8">
            <textarea
              id="content"
              rows={16}
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed text-ink placeholder:text-taupe/50 focus:outline-none focus:ring-0"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.015, boxShadow: '0 14px 34px -14px rgba(122,46,61,0.55)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-full bg-maroon py-3 text-sm font-medium text-cream shadow-warm-sm transition-colors sm:w-auto sm:px-10"
          >
            Publish story
          </motion.button>
        </form>
      </motion.div>

      <div className="lg:sticky lg:top-24 lg:col-span-2">
        <AIAssistPanel content={content} title={title} onApplyTitle={setTitle} />
      </div>
    </div>
  );
};

export default CreatePost;
