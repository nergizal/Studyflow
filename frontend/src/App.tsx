import { useEffect, useState } from "react";

interface Task {
  _id: string;
  title: string;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const fetchTasks = () => {
    fetch("http://localhost:5001/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTitle.trim()) return;

    await fetch("http://localhost:5001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle })
    });

    setNewTitle("");
    fetchTasks();
  };

  const toggleTask = async (task: Task) => {
    await fetch(`http://localhost:5001/api/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed })
    });

    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`http://localhost:5001/api/tasks/${id}`, {
      method: "DELETE"
    });

    fetchTasks();
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>StudyFlow</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni task gir..."
        />
        <button onClick={addTask}>Ekle</button>
      </div>

      {tasks.map(task => (
        <div key={task._id} style={{ marginBottom: "10px" }}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task)}
          />

          <span
            style={{
              marginLeft: "10px",
              textDecoration: task.completed ? "line-through" : "none"
            }}
          >
            {task.title}
          </span>

          <button
            style={{ marginLeft: "10px" }}
            onClick={() => deleteTask(task._id)}
          >
            Sil
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
