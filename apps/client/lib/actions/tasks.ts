function addTask(task: string): void {
  


}

function getAllTasks(): string[] {
  // Logic to retrieve tasks from the task list
  return ["Task 1", "Task 2", "Task 3"];
}

function removeTask(taskId: number): void {
  // Logic to remove the task from the task list
  console.log(`Task removed: ${taskId}`);
}

function updateTask(taskId: number, updatedTask: string): void {
  // Logic to update the task in the task list
  console.log(`Task updated: ${taskId}, New Task: ${updatedTask}`);
}

export { addTask, getAllTasks, removeTask, updateTask };