import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { ReviewType } from '@/lib/types';
import { Copy, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { TabsContent } from '../ui/tabs';

export default function ReviewSection() {
  const [link, setLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data }: { data: ReviewType[] } = await axios.get('/testimonials');
      const sorted = data.sort((a, b) => (b.admin ? 1 : 0) - (a.admin ? 1 : 0));
      setReviews(sorted);
    } finally {
      setLoading(false);
    }
  }

  async function generateLink() {
    if (!user?.id) return;
    try {
      setLinkLoading(true);
      const res = await axios.post('/testimonials/generate-link', { user_id: user?.id });
      const link = res.data.link;
      toast.success('Link created successfully! It will expire in 24 hours.');
      setLink(link);
    } finally {
      setLinkLoading(false);
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <TabsContent value="Review" className="space-y-4">
      <div className="flex justify-center w-full mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            className="sm:w-xl w-full h-10"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          {link && (
            <Button variant="ghost" onClick={handleCopy} className="p-2">
              <Copy />
            </Button>
          )}
          <Button disabled={linkLoading} onClick={generateLink}>
            {linkLoading && <Spinner className="text-black h-5 w-5 mr-2" />}
            Generate Link
          </Button>

          <Button
            disabled={loading}
            size={'icon-sm'}
            onClick={async () => {
              await fetchData();
            }}
          >
            <RefreshCcw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
      <div className="space-y-4 mt-4">
        {reviews.map((r, i) => (
          <EachReview
            sr={i + 1}
            r={r}
            key={r.id}
            onUpdateCheckBox={(item) => {
              setReviews((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, show: item.show } : r))
              );
            }}
            onUpdateReview={(item) => {
              setReviews((prev) => prev.map((r) => (r.id === item.id ? item : r)));
            }}
          />
        ))}
      </div>
    </TabsContent>
  );
}

const EachReview = ({
  sr,
  r,
  onUpdateCheckBox,
  onUpdateReview,
}: {
  sr: number;
  r: ReviewType;
  onUpdateCheckBox: ({ id, show }: { id: number; show: boolean }) => void;
  onUpdateReview: (item: ReviewType) => void;
}) => {
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewType | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  async function saveAdminEdit() {
    if (!selectedReview) return;
    setUpdateLoading(true);
    try {
      await axios.put('/testimonials', selectedReview);
      onUpdateReview(selectedReview);
      toast.success('Admin update saved');
      handleCloseDialog();
    } finally {
      setUpdateLoading(false);
    }
  }

  function handleCloseDialog() {
    setSelectedReview(null);
  }

  const handleCheckboxChange = async (s: boolean) => {
    setLoading(true);
    try {
      await axios.put('/testimonials', { id: r.id, show: s });
      onUpdateCheckBox({ id: r.id, show: s });
      toast.success('Review updated');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div key={r.id} className="flex items-start gap-3 p-4 rounded-lg border">
        <h3 className="mt-1">{sr}</h3>
        <div className="flex-1">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold">{r.title}</h3>
            {r.admin && <span className="text-xs text-yellow-400 font-semibold">Admin</span>}
          </div>
          <p className="text-gray-300 mb-1">{r.description}</p>
          <p className="text-sm text-gray-400">
            {r.name} - {r.designation}
          </p>
          <p className="text-yellow-400 mt-1">
            {'★'.repeat(r.rating)}
            {'☆'.repeat(5 - r.rating)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          {loading ? (
            <Spinner />
          ) : (
            !r.admin && (
              <Checkbox
                checked={r.show}
                onCheckedChange={(r) => handleCheckboxChange(r as boolean)}
              />
            )
          )}

          {r.admin && (
            <Button size="sm" variant="outline" onClick={() => setSelectedReview(r)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <Dialog open={!!selectedReview} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>Edit and update review display state.</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 mt-2">
              <div className="mb-4">
                <label className="text-xs text-[#bbb] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
                  value={selectedReview.title}
                  onChange={(e) => setSelectedReview({ ...selectedReview, title: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-[#bbb] block mb-1">Description</label>
                <textarea
                  required
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-[90px]"
                  value={selectedReview.description}
                  onChange={(e) =>
                    setSelectedReview({ ...selectedReview, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[#bbb] block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
                    value={selectedReview.name}
                    onChange={(e) => setSelectedReview({ ...selectedReview, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#bbb] block mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Athlete, Parent"
                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
                    value={selectedReview.designation}
                    onChange={(e) =>
                      setSelectedReview({ ...selectedReview, designation: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-[#bbb] block mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSelectedReview({ ...selectedReview, rating: star })}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="text-2xl"
                    >
                      <span
                        className={
                          (hover || selectedReview.rating) >= star
                            ? 'text-[#c8f020]'
                            : 'text-[#3a3a3a]'
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button disabled={updateLoading} onClick={saveAdminEdit}>
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
