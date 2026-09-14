import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Sparkles, Plus, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { SubscriptionPlan } from '../types';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      await api.patch(`/plans/${selectedPlan.id}`, selectedPlan);
      setSelectedPlan(null);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Subscription Plan Configurations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurable Basic, Standard, and Premium membership tiers with ride allowances and cancellation rules
          </p>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPremium = plan.tier === 'PREMIUM';
          const isStandard = plan.tier === 'STANDARD';

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 relative flex flex-col justify-between transition-all duration-200 ${
                isPremium
                  ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10'
                  : isStandard
                  ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                  : 'bg-slate-900 border border-slate-800'
              }`}
            >
              {isStandard && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase shadow-md">
                  Most Popular
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-500 text-white font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> VIP Unlimited
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{plan.name}</h3>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹{plan.price}</span>
                  <span className="text-xs text-slate-400">/ {plan.validity_days} Days</span>
                </div>

                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span><strong>{plan.ride_count_total} Rides Included</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{plan.round_trip_allowed ? 'Round-trip Commutes Allowed' : 'One-way Only'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Cancel up to <strong>{plan.cancellation_hours_limit} hrs</strong> prior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Cancellation Fee: <strong>{plan.cancellation_fee_percentage}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Extra Ride: ₹{plan.additional_ride_charge}/ride</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Status: {plan.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">Tier: {plan.tier}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title="Configure Subscription Plan">
        {selectedPlan && (
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Plan Display Name</label>
              <input
                type="text"
                required
                value={selectedPlan.name}
                onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Description</label>
              <input
                type="text"
                required
                value={selectedPlan.description || ''}
                onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={selectedPlan.price}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, price: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Validity (Days)</label>
                <input
                  type="number"
                  required
                  value={selectedPlan.validity_days}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, validity_days: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Included Rides</label>
                <input
                  type="number"
                  required
                  value={selectedPlan.ride_count_total}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, ride_count_total: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Cancellation Cutoff (Hours)</label>
                <input
                  type="number"
                  required
                  value={selectedPlan.cancellation_hours_limit}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, cancellation_hours_limit: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
              >
                Update Plan Settings
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
