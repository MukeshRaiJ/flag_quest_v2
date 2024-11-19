import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface UserStats {
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  achievements: string[];
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  region?: string;
  timestamp: number;
}

export const userStats = {
  async updateStats(
    userId: string,
    gameScore: number,
    newAchievements: string[] = []
  ) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      gamesPlayed: increment(1),
      totalScore: increment(gameScore),
      highScore: increment(0), // Will be updated in transaction if higher
      achievements: newAchievements,
    });
  },

  async getStats(userId: string): Promise<UserStats> {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDocs(
      query(collection(db, "users"), where("userId", "==", userId))
    );
    return snapshot.docs[0].data() as UserStats;
  },
};

export const leaderboard = {
  async addScore(entry: Omit<LeaderboardEntry, "timestamp">) {
    const leaderboardRef = collection(db, "leaderboard");
    await setDoc(doc(leaderboardRef), {
      ...entry,
      timestamp: Date.now(),
    });
  },

  async getGlobalLeaderboard(limit: number = 10) {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(leaderboardRef, orderBy("score", "desc"), limit(limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as LeaderboardEntry);
  },

  async getRegionalLeaderboard(region: string, limit: number = 10) {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("region", "==", region),
      orderBy("score", "desc"),
      limit(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as LeaderboardEntry);
  },
};
