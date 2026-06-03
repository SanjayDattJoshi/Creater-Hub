const Loader = ({ text = 'Loading…' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
};

export default Loader;