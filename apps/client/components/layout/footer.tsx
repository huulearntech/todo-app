export default function Footer() {
  return (
    <footer className="bg-card text-muted-foreground border-t border-border/50 p-4 mt-auto text-xs">
      <p className="text-center">&copy; {new Date().getFullYear()} To-Do App. All rights reserved.</p>
    </footer>
  );
}