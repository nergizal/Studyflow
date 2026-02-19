export interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  deadline?: string;
  timeSpent: number;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  estimated_pomodoros: number;
  createdAt: string;
<<<<<<< Updated upstream
}
=======
}

//2. pr denemesi ???
//şimdi 2.pr test branchi deniyorum.
>>>>>>> Stashed changes
