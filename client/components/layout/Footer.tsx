import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#030307] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black fill-black" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">launch.io</span>
            </div>
            <p className="text-white/45 text-sm max-w-sm font-normal leading-relaxed">
              Autonomous cloud platform for instant previews, Railpack builds, and global edge deployments.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">Edge Network</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">Railpack Engine</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Instant Previews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/50">
              <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">CLI Tool</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/50">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy & Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} launch.io Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
