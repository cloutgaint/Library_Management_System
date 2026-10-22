import { useEffect, useState } from "react";
import ProfileCard from "../../components/member/ProfileCard";
import MembershipCard from "../../components/member/MembershipCard";

function Profile() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/members/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setMember(data.member);
      } catch (err) {
        console.error("Profile Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-3xl mx-auto bg-red-100 text-red-700 p-5 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-8 text-blue-700">
          Member Profile
        </h1>

        <ProfileCard
          member={member}
          onProfileImageChange={(newImage) => {
            setMember((previousMember) => ({
              ...previousMember,
              profile_image: newImage,
            }));
          }}
        />

        <div className="mt-10">
          <MembershipCard member={member} />
        </div>

      </div>
    </div>
  );
}

export default Profile;