interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="flex items-center justify-center h-screen max-w-screen w-full">
      {children}
    </div>
  );
}
