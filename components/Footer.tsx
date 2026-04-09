import Image from "next/image";

export default function Footer(){
    return (
        <footer className="w-full shrink-0">
            <div className="flex flex-row w-full bg-mauve-800 border-t border-gray-300 text-white justify-between items-center mx-auto px-4 py-3 text-sm">
                <div> &#169;2026, Nirav Pandey </div>
                <div className="flex items-center gap-2">
                <span>Source code in</span>
                <Image
                    src="https://apqsehnfehgcygadnrgq.supabase.co/storage/v1/object/public/Assets/icons/GitHub.png"
                    width={16}
                    height={16}
                    alt="GitHub"
                    className="h-4 w-4 rounded-full bg-white p-0.5"
                />
                <span>GitHub</span>
                </div>
            </div>
        </footer>
    )
}
