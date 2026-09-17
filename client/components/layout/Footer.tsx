import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#030307] px-4 pt-16 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white">
                <Zap className="h-3.5 w-3.5 fill-black text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                launch.io
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed font-normal text-white/45">
              Autonomous cloud platform for instant previews, Railpack builds,
              and global edge deployments.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-white/90 uppercase">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-white/50 sm:text-sm">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-white"
                >
                  Edge Network
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="transition-colors hover:text-white"
                >
                  Railpack Engine
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors hover:text-white"
                >
                  Instant Previews
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Enterprise
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-white/90 uppercase">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-white/50 sm:text-sm">
              <li>
                <a href="#docs" className="transition-colors hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  CLI Tool
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-white/90 uppercase">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-white/50 sm:text-sm">
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Privacy & Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} launch.io Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
