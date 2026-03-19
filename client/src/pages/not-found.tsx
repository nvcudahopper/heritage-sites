import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-xl font-bold mb-2">页面未找到</h1>
      <p className="text-sm text-muted-foreground mb-6">你访问的页面不存在</p>
      <Link href="/" className="text-primary text-sm hover:underline no-underline">
        返回首页
      </Link>
    </div>
  );
}
