"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

// Define the type for a shortlink object
interface Shortlink {
  _id: string;
  originalUrl: string;
  shortUrl: string;
}

const Dashboard = () => {
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]); // State to store the user's shortlinks
  const [newUrl, setNewUrl] = useState<string>(""); // State for new URL input
  const [newShortUrl, setNewShortUrl] = useState<string>(""); // State for custom short URL input
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [editingLink, setEditingLink] = useState<Shortlink | null>(null); // State to manage editing

  // Fetch user's shortlinks when the component mounts
  useEffect(() => {
    const fetchShortlinks = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/shortlinks", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Make sure token is valid
          },
        });
        const data = await response.json();
        if (response.ok) {
          setShortlinks(data.shortlinks); // Update the state with the fetched shortlinks
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to fetch shortlinks.",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while fetching shortlinks.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchShortlinks();
  }, []); // Empty dependency array to run only once on mount

  // Handle form submission for creating a new shortlink
  const handleCreateShortlink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) {
      Swal.fire({
        icon: "warning",
        title: "Input Required",
        text: "Please provide a valid URL.",
      });
      return;
    }

    setLoading(true);

    const formData = {
      originalUrl: newUrl,
      customShortUrl: newShortUrl || undefined, // Include custom short URL if provided
    };

    try {
      const response = await fetch("http://localhost:5000/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        // Add the new shortlink to the list
        setShortlinks((prevLinks) => [
          ...prevLinks,
          {
            originalUrl: data.originalUrl,
            shortUrl: data.shortUrl,
            _id: data._id,
          },
        ]);

        setNewUrl("");
        setNewShortUrl("");
        Swal.fire({
          icon: "success",
          title: "Shortlink Created!",
          text: `Your shortlink: ${data.shortUrl}`,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to create shortlink",
          text: data.error || "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while creating the shortlink.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit of a shortlink
  const handleEdit = (link: Shortlink) => {
    setEditingLink(link); // Set the link to be edited
    setNewUrl(link.originalUrl); // Populate the new URL with the original URL of the selected link
    setNewShortUrl(link.shortUrl); // Populate the custom short URL with the selected short URL
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;

    setLoading(true);
    const { originalUrl, shortUrl } = editingLink;

    // Check if the new short URL is different from the original one
    const isShortUrlChanged = newShortUrl !== shortUrl;

    try {
      // If the short URL is changed, check if it's available
      if (isShortUrlChanged) {
        const response = await fetch(`http://localhost:5000/api/shortlinks`);
        const data = await response.json();
        const existingLink = data.shortlinks.find(
          (link: Shortlink) => link.shortUrl === newShortUrl
        );

        // If the new short URL is already taken, show an error
        if (existingLink) {
          Swal.fire({
            icon: "error",
            title: "Short URL Taken",
            text: "The custom short URL you provided is already taken.",
          });
          return;
        }
      }

      // Proceed with the update if no conflict
      const response = await fetch(
        `http://localhost:5000/api/edit/${shortUrl}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalUrl: newUrl, // Update the original URL from the input field
            newShortUrl: newShortUrl, // Use the updated short URL from the input field
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Update the shortlinks state with the edited link
        setShortlinks((prevLinks) =>
          prevLinks.map((link) =>
            link._id === data.link._id ? data.link : link
          )
        );
        Swal.fire({
          icon: "success",
          title: "Shortlink Updated!",
          text: "Your shortlink has been updated.",
        });
        setEditingLink(null); // Reset editing state
        setNewUrl("");
        setNewShortUrl("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to update shortlink",
          text: data.error || "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the shortlink.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion of a shortlink
  const handleDelete = async (shortUrl: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this shortlink?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
    });

    if (confirm.isConfirmed) {
      setLoading(true);

      try {
        const response = await fetch(
          `http://localhost:5000/api/delete/${shortUrl}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();
        if (response.ok) {
          // Remove the deleted shortlink from the state
          setShortlinks((prevLinks) =>
            prevLinks.filter((link) => link.shortUrl !== shortUrl)
          );
          Swal.fire({
            icon: "success",
            title: "Shortlink Deleted!",
            text: "Your shortlink has been deleted.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed to delete shortlink",
            text: data.error || "Something went wrong!",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while deleting the shortlink.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Shortlink Dashboard</h2>

      <form onSubmit={handleCreateShortlink} className="mb-4">
        <label className="block text-lg mb-2">
          Enter the URL you want to shorten:
        </label>
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="input input-bordered w-full"
          placeholder="Enter original URL"
          required
        />

        <label className="block text-lg mb-2">
          Enter a custom short URL (optional):
        </label>
        <input
          type="text"
          value={newShortUrl}
          onChange={(e) => setNewShortUrl(e.target.value)}
          className="input input-bordered w-full"
          placeholder="Custom short URL (optional)"
        />

        <button
          type="submit"
          className={`btn btn-primary w-full mt-5 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Shortlink"}
        </button>
      </form>

      {shortlinks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Your Shortlinks:</h3>
          <ul>
            {shortlinks.map((link, index) => (
              <li
                key={link._id || index}
                className="flex items-center justify-between mb-4 bg-base-300 p-4 rounded-lg  "
              >
                <div>
                  <strong>{link.shortUrl}</strong> - {link.originalUrl}
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-blue-500"
                    onClick={() => handleEdit(link)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => handleDelete(link.shortUrl)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editingLink && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Edit Shortlink:</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <label className="block text-lg mb-2">Edit Original URL:</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="input input-bordered w-full"
              required
            />

            <label className="block text-lg mb-2">Edit Custom Short URL:</label>
            <input
              type="text"
              value={newShortUrl}
              onChange={(e) => setNewShortUrl(e.target.value)}
              className="input input-bordered w-full"
            />

            <button
              onClick={handleSaveEdit}
              className={`btn btn-primary w-full mt-5 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
