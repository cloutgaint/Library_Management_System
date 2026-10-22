function AuthCard({ title, subtitle, children }) {
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

      <div className="bg-blue-600 text-white p-8">

        <div className="flex justify-center mb-4">

          <div className="w-16 h-16 rounded-full bg-white text-3xl flex items-center justify-center">

            📚

          </div>

        </div>

        <h1 className="text-3xl font-bold text-center">

          {title}

        </h1>

        <p className="text-center text-blue-100 mt-2">

          {subtitle}

        </p>

      </div>

      <div className="p-8">

        {children}

      </div>

    </div>
  );
}

export default AuthCard;
