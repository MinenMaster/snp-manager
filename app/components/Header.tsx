// app/components/Header.tsx
import Link from "next/link";

const Header = () => (
    <header>
        <nav>
            <Link href="/">Home</Link>
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register">Register</Link>
            <Link href="/dashboard/passwords">Dashboard</Link>
        </nav>
    </header>
);

export default Header;
