import { create } from "zustand";
import { commercialService } from "@/services/CommercialService";
import type { CommercialState, CreditCharge } from "@/types/Commercial";

interface CommercialStoreState {
  state: CommercialState;
  loaded: boolean;
  load: () => Promise<void>;
  spendCredits: (charge: CreditCharge) => Promise<boolean>;
}

export const useCommercialStore = create<CommercialStoreState>((set, get) => ({
  state: commercialService.normalize(null),
  loaded: false,
  load: async () => {
    const state = await commercialService.load();
    set({ state, loaded: true });
  },
  spendCredits: async (charge) => {
    const current = get().state;
    if (!commercialService.canSpend(current, charge.amount)) {
      const updated = await commercialService.consumeCredits(current, charge);
      set({ state: updated, loaded: true });
      return false;
    }

    const updated = await commercialService.consumeCredits(current, charge);
    set({ state: updated, loaded: true });
    return true;
  }
}));
