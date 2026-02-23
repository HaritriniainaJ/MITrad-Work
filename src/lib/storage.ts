import { User, Trade, DailyAnalysis, TradingAccount } from '@/types/trading';

export class StorageManager {
  static getUsers(): User[] {
    return JSON.parse(localStorage.getItem('mitrad_users') || '[]');
  }

  static getUser(email: string): User | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  static updateUser(email: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem('mitrad_users', JSON.stringify(users));
    }
  }

  static getAllTrades(): Trade[] {
    return JSON.parse(localStorage.getItem('mitrad_trades') || '[]');
  }

  static getUserTrades(userId: string, accountId?: string): Trade[] {
    const trades = this.getAllTrades().filter(t => t.userId === userId);
    if (accountId) return trades.filter(t => t.accountId === accountId);
    return trades;
  }

  // ── NOUVEAU : filtre multi-comptes ──────────────────────────────────────
  // accountIds vide ou absent = tous les comptes
  static getUserTradesByAccounts(userId: string, accountIds?: string[]): Trade[] {
    const trades = this.getAllTrades().filter(t => t.userId === userId);
    if (!accountIds || accountIds.length === 0) return trades;
    return trades.filter(t => t.accountId && accountIds.includes(t.accountId));
  }
  // ────────────────────────────────────────────────────────────────────────

  static addTrade(trade: Trade): void {
    const trades = this.getAllTrades();
    trades.unshift(trade);
    localStorage.setItem('mitrad_trades', JSON.stringify(trades));
  }

  static updateTrade(tradeId: string, updates: Partial<Trade>): void {
    const trades = this.getAllTrades();
    const idx = trades.findIndex(t => t.id === tradeId);
    if (idx !== -1) {
      trades[idx] = { ...trades[idx], ...updates };
      localStorage.setItem('mitrad_trades', JSON.stringify(trades));
    }
  }

  static deleteTrade(tradeId: string): void {
    const trades = this.getAllTrades().filter(t => t.id !== tradeId);
    localStorage.setItem('mitrad_trades', JSON.stringify(trades));
  }

  static getAnalyses(userId: string): DailyAnalysis[] {
    const all: DailyAnalysis[] = JSON.parse(localStorage.getItem('mitrad_analyses') || '[]');
    return all.filter(a => a.userId === userId);
  }

  static getAllAnalyses(): DailyAnalysis[] {
    return JSON.parse(localStorage.getItem('mitrad_analyses') || '[]');
  }

  static addAnalysis(analysis: DailyAnalysis): void {
    const all = this.getAllAnalyses();
    all.unshift(analysis);
    localStorage.setItem('mitrad_analyses', JSON.stringify(all));
  }

  static deleteAnalysis(id: string): void {
    const all = this.getAllAnalyses().filter(a => a.id !== id);
    localStorage.setItem('mitrad_analyses', JSON.stringify(all));
  }

  static updateAnalysis(id: string, updates: Partial<DailyAnalysis>): void {
    const all = this.getAllAnalyses();
    const idx = all.findIndex(a => a.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      localStorage.setItem('mitrad_analyses', JSON.stringify(all));
    }
  }

  static getAccounts(userId: string): TradingAccount[] {
    const all: TradingAccount[] = JSON.parse(localStorage.getItem('mitrad_accounts') || '[]');
    return all.filter(a => a.userId === userId);
  }

  static getAllAccounts(): TradingAccount[] {
    return JSON.parse(localStorage.getItem('mitrad_accounts') || '[]');
  }

  static addAccount(account: TradingAccount): void {
    const all = this.getAllAccounts();
    all.push(account);
    localStorage.setItem('mitrad_accounts', JSON.stringify(all));
  }

  static updateAccount(accountId: string, updates: Partial<TradingAccount>): void {
    const all = this.getAllAccounts();
    const idx = all.findIndex(a => a.id === accountId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      localStorage.setItem('mitrad_accounts', JSON.stringify(all));
    }
  }

  static deleteAccount(accountId: string): void {
    const all = this.getAllAccounts().filter(a => a.id !== accountId);
    localStorage.setItem('mitrad_accounts', JSON.stringify(all));
  }

  static exportData(userId: string): string {
    return JSON.stringify({
      user: this.getUser(userId),
      trades: this.getUserTrades(userId),
      analyses: this.getAnalyses(userId),
      accounts: this.getAccounts(userId),
    }, null, 2);
  }

  static importData(json: string, userId: string): void {
    const data = JSON.parse(json);
    if (data.trades) {
      const existingTrades = this.getAllTrades().filter(t => t.userId !== userId);
      const importedTrades = data.trades.map((t: Trade) => ({ ...t, userId }));
      localStorage.setItem('mitrad_trades', JSON.stringify([...importedTrades, ...existingTrades]));
    }
  }

  static resetUserData(userId: string): void {
    const trades = this.getAllTrades().filter(t => t.userId !== userId);
    localStorage.setItem('mitrad_trades', JSON.stringify(trades));
    const analyses = this.getAllAnalyses().filter(a => a.userId !== userId);
    localStorage.setItem('mitrad_analyses', JSON.stringify(analyses));
  }

  static tradesToCSV(trades: Trade[]): string {
    const headers = 'Date,Paire,Direction,Session,Setup,Émotion,Qualité,Entrée,SL,TP,Sortie,Résultat R,Résultat $,Statut,Durée,Compte\n';
    const rows = trades.map(t =>
      `${t.date},${t.pair},${t.direction},${t.session},${t.setup},${t.emotion},${t.quality},${t.entryPrice},${t.stopLoss},${t.takeProfit},${t.exitPrice || ''},${t.resultR},${t.resultDollar},${t.status},${t.duration},${t.accountId || ''}`
    ).join('\n');
    return headers + rows;
  }
}