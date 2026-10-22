import { useRef, useState } from "react";

function ProfileCard({ member, onProfileImageChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(member.full_name || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [address, setAddress] = useState(member.address || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  const profileImage = member.profile_image
    ? `http://localhost:5000${member.profile_image}`
    : "/default-profile.png";

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/members/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: fullName,
            phone,
            address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      member.full_name = data.member.full_name;
      member.phone = data.member.phone;
      member.address = data.member.address;

      setFullName(data.member.full_name || "");
      setPhone(data.member.phone || "");
      setAddress(data.member.address || "");

      setMessage("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await fetch(
        "http://localhost:5000/api/members/profile/image",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload profile picture"
        );
      }

onProfileImageChange(data.member.profile_image);
      setMessage("Profile picture updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex flex-col items-center">
        <img
          src={profileImage}
          alt="Profile"
          className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-md object-cover"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="mt-4 bg-blue-100 hover:bg-blue-200 text-blue-700 px-5 py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {uploadingImage ? "Uploading..." : "Edit Profile Picture"}
        </button>

        {isEditing ? (
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-4 w-full max-w-md border rounded-lg px-4 py-2 text-center text-2xl font-bold"
          />
        ) : (
          <h2 className="text-2xl font-bold mt-4">
            {member.full_name}
          </h2>
        )}

        <p className="text-gray-500">
          Member ID: {member.id}
        </p>
      </div>

      {message && (
        <p className="mt-4 text-center text-green-600 font-semibold">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 text-center text-red-600 font-semibold">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Email</span>
          <span>{member.email}</span>
        </div>

        <div className="border-b pb-2">
          <div className="flex justify-between">
            <span className="font-semibold">Phone</span>

            {isEditing ? (
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded px-3 py-1"
              />
            ) : (
              <span>{member.phone || "Not provided"}</span>
            )}
          </div>
        </div>

        <div className="border-b pb-2">
          <div className="flex justify-between">
            <span className="font-semibold">Address</span>

            {isEditing ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border rounded px-3 py-1"
              />
            ) : (
              <span>{member.address || "Not provided"}</span>
            )}
          </div>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Membership Status</span>
          <span>{member.membership_status}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Joined Date</span>
          <span>{member.membership_start}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold">Valid Till</span>
          <span>{member.membership_expiry}</span>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
}

export default ProfileCard;