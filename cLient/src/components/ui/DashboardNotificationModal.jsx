import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ArrowRight, X, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/format';

export default function DashboardNotificationModal({
  notifications = [],
  isOpen,
  onMarkSeen,
  onDismiss
}) {
  const active = notifications[0] || null;

  return (
    <AnimatePresence>
      {isOpen && active && (
        <motion.div
          className="fixed bottom-5 right-5 z-50 w-[min(390px,calc(100vw-24px))]"
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          <div className="rounded-2xl bg-white border border-blue-200 overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-4 py-3 text-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Bell size={15} />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
                </span>
                <div>
                  <p className="text-xs font-extrabold leading-tight text-slate-900">
                    New Notification {notifications.length > 1 ? `(${notifications.length} unread)` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">Action required to view details</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label="Dismiss notification popup"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {active.title || 'Update Received'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {active.message}
                </p>
                {active.createdAt && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock size={11} />
                    {formatDateTime(active.createdAt)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={() => onMarkSeen(active)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  <CheckCheck size={14} />
                  <span>Mark Seen</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
