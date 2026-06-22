import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-shell py-14 sm:py-24">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.4rem] bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-yara-rose lg:block">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzdwP72auqrJCI0EARy7mDDFYqNts1I9jX0nj0DITvpbaalqe5GSB1pVJkCMmAH7Q6MOjYQCjPvNkXbcQSSqPG254zrYjGY6CJIpABviZ3Q5_d2LTe6SaweblF1kITxtYi0MCeeURFsh-yb6sl-SC5yQJEhD4Jnr2s3WBIqElicaOTclqdEXBRneYsK2tJdfpROWBBdZ1MZe9rEqD9c4Exm5PzL07PqSuqcI4w1IcKdTgOKjbopRvoJktSqFBL-g7kCo87rwkXKEsk" alt="Woman with naturally radiant skin" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-yara-ink/65 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-10 text-white"><p className="eyebrow !text-yara-rose">Your favorites, remembered</p><h2 className="mt-4 text-4xl">Welcome back to your glow.</h2><p className="mt-4 text-sm font-light leading-7 text-white/80">Revisit your favorites, track orders, and make self-care beautifully simple.</p></div>
        </div>
        <div className="flex items-center p-7 sm:p-12 lg:p-16">
          <div className="w-full">
            <p className="eyebrow">The YARA circle</p><h1 className="mt-3 text-4xl sm:text-5xl">Welcome Back</h1><p className="mt-4 text-sm font-light leading-7 text-yara-taupe">Sign in to continue shopping.</p>
            {submitted ? (
              <div className="mt-8 rounded-[1.7rem] bg-[#e9f8ee] p-6 text-sm leading-7 text-[#176b38]">Your sign-in request has been received. Connect this form to your preferred authentication service for live customer accounts.</div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block"><span className="field-label">Email address</span><span className="relative block"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" /><input type="email" required autoComplete="email" placeholder="you@example.com" className="field pl-11" /></span></label>
                <label className="block"><span className="field-label">Password</span><span className="relative block"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yara-taupe" /><input type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Your password" className="field px-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-yara-taupe" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
                <div className="flex justify-between gap-3 text-xs"><label className="flex items-center gap-2"><input type="checkbox" className="accent-yara-wine" /> Remember me</label><button type="button" className="text-yara-wine">Forgot password?</button></div>
                <button className="btn-primary w-full">Sign in <ArrowRight className="h-4 w-4" /></button>
              </form>
            )}
            <p className="mt-7 text-center text-xs text-yara-taupe">New to YARA? <Link to="/contact" className="font-semibold text-yara-wine">Create an account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
