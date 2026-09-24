import { createClient } from "@supabase/supabase-js";
import productsData from "../data/products.json";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    typeof supabaseUrl === "string" &&
    supabaseUrl.startsWith("http"),
);

// ─────────────────────────────────────────────
// In-Memory & LocalStorage Mock Store
// ─────────────────────────────────────────────
function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`felicite_mock_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`felicite_mock_${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

const initialProducts = (productsData as any[]).map((p: any, idx: number) => ({
  ...p,
  id: p.id || `prod-${idx + 1}`,
  is_new_arrival: p.isNewArrival ?? true,
  sold_out: p.soldOut ?? false,
  created_at: new Date(Date.now() - idx * 86400000).toISOString(),
}));

const initialCategories = Array.from(
  new Set((productsData as any[]).map((p: any) => p.category).filter(Boolean)),
).map((name, i) => ({
  id: `cat-${i + 1}`,
  name,
  sort_order: i,
}));

const initialShowcases = [
  { section: "must_buy", product_id: initialProducts[0]?.id, sort_order: 1 },
  { section: "trending", product_id: initialProducts[1]?.id, sort_order: 1 },
  { section: "new_arrivals", product_id: initialProducts[2]?.id, sort_order: 1 },
];

const mockStore: Record<string, any[]> = {
  products: getStorage("products", initialProducts),
  categories: getStorage("categories", initialCategories),
  showcases: getStorage("showcases", initialShowcases),
  orders: getStorage("orders", []),
  checkout_sessions: getStorage("checkout_sessions", []),
  contact_messages: getStorage("contact_messages", []),
};

const channelListeners: Map<string, Set<() => void>> = new Map();

function notifyTableChanges(table: string) {
  channelListeners.forEach((callbacks, channelKey) => {
    if (channelKey.includes(table)) {
      callbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.warn("[Mock Channel Error]", e);
        }
      });
    }
  });
}

class MockQueryBuilder {
  private table: string;
  private filters: ((item: any) => boolean)[] = [];
  private orderField?: string;
  private ascending: boolean = true;
  private limitCount?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_fields?: string) {
    return this;
  }

  insert(data: any | any[]) {
    this.operation = "insert";
    this.payload = data;
    return this;
  }

  upsert(data: any | any[]) {
    this.operation = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item) => String(item[field]) === String(value));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  private execute(): { data: any; error: any } {
    if (!mockStore[this.table]) {
      mockStore[this.table] = [];
    }
    let list = mockStore[this.table];

    if (this.operation === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => ({
        id: item.id || `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        ...item,
      }));
      mockStore[this.table] = [...inserted, ...list];
      setStorage(this.table, mockStore[this.table]);
      notifyTableChanges(this.table);
      return { data: inserted, error: null };
    }

    if (this.operation === "update") {
      let updatedCount = 0;
      mockStore[this.table] = list.map((item) => {
        const matches = this.filters.every((f) => f(item));
        if (matches) {
          updatedCount++;
          return { ...item, ...this.payload };
        }
        return item;
      });
      if (updatedCount > 0) {
        setStorage(this.table, mockStore[this.table]);
        notifyTableChanges(this.table);
      }
      return { data: this.payload, error: null };
    }

    if (this.operation === "delete") {
      mockStore[this.table] = list.filter((item) => !this.filters.every((f) => f(item)));
      setStorage(this.table, mockStore[this.table]);
      notifyTableChanges(this.table);
      return { data: null, error: null };
    }

    // Default: select
    let result = list.filter((item) => this.filters.every((f) => f(item)));

    if (this.orderField) {
      const field = this.orderField;
      const asc = this.ascending;
      result = [...result].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return (valA > valB ? 1 : -1) * (asc ? 1 : -1);
      });
    }

    if (typeof this.rangeFrom === "number" && typeof this.rangeTo === "number") {
      result = result.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (typeof this.limitCount === "number") {
      result = result.slice(0, this.limitCount);
    }

    return { data: result, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const res = this.execute();
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }
}

// ─────────────────────────────────────────────
// Mock Supabase Client
// ─────────────────────────────────────────────
let currentUser: any = getStorage("auth_user", null);
const authListeners: Set<(event: string, session: any) => void> = new Set();

function createMockSupabaseClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    channel: (name: string) => {
      const channelObj = {
        on: (_event: string, _filter: any, callback: () => void) => {
          if (!channelListeners.has(name)) {
            channelListeners.set(name, new Set());
          }
          channelListeners.get(name)!.add(callback);
          return channelObj;
        },
        subscribe: () => channelObj,
      };
      return channelObj;
    },
    removeChannel: (channelObj: any) => {
      channelListeners.forEach((set) => {
        if (channelObj && set.has(channelObj)) {
          set.delete(channelObj);
        }
      });
    },
    auth: {
      getSession: async () => ({
        data: {
          session: currentUser ? { user: currentUser } : null,
        },
        error: null,
      }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.add(callback);
        if (currentUser) {
          callback("SIGNED_IN", { user: currentUser });
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback),
            },
          },
        };
      },
      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        currentUser = {
          id: `usr-${Date.now()}`,
          email,
        };
        setStorage("auth_user", currentUser);
        const session = { user: currentUser };
        authListeners.forEach((cb) => cb("SIGNED_IN", session));
        return { data: { user: currentUser, session }, error: null };
      },
      signOut: async () => {
        currentUser = null;
        setStorage("auth_user", null);
        authListeners.forEach((cb) => cb("SIGNED_OUT", null));
        return { error: null };
      },
    },
  };
}

let client: any;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        lock: async (_name, _acquireTimeout, fn) => await fn(),
      },
    });
  } catch (err) {
    console.warn("[Supabase] Failed to initialize live client, using mock fallback:", err);
    client = createMockSupabaseClient();
  }
} else {
  client = createMockSupabaseClient();
}

export const supabase = client;
export default supabase;
