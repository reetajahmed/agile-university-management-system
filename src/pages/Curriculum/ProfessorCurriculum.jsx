import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/curriculum.css";

const MATERIALS_BUCKETS = ["course_materials", "course-materials"];

function ProfessorCurriculum() {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfessorData = async () => {
    setLoading(true);

    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .order("name", { ascending: true });

    const { data: materialsData } = await supabase
      .from("course_materials")
      .select(`*, course:courses(name, "Course Code")`)
      .order("id", { ascending: false });

    setCourses(coursesData || []);
    setMaterials(materialsData || []);
    setLoading(false);
  };

  const uploadMaterial = async (e) => {
    e.preventDefault();

    if (!selectedCourseId || !title || !file || uploading) {
      setMessage("Please select a course, enter a title, and choose a file.");
      return;
    }

    setUploading(true);
    setMessage("");

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const filePath = `${selectedCourseId}/${Date.now()}-${safeFileName}`;
    const materialType = file.type?.split("/")[1] || "file";

    let uploadError = null;
    let uploadedBucket = "";

    for (const bucket of MATERIALS_BUCKETS) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (!error) {
        uploadedBucket = bucket;
        uploadError = null;
        break;
      }

      uploadError = error;
    }

    if (uploadError) {
      console.log(uploadError);
      setMessage(
        `Upload failed: ${uploadError.message}. Create a public Supabase Storage bucket named course_materials.`
      );
      setUploading(false);
      return;
    }

    const { data: fileData } = supabase.storage
      .from(uploadedBucket)
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("course_materials").insert([
      {
        course_id: selectedCourseId,
        title,
        file_url: fileData.publicUrl,
        type: materialType,
      },
    ]);

    if (insertError) {
      console.log(insertError);
      setMessage(`File uploaded, but material was not saved: ${insertError.message}`);
    } else {
      setTitle("");
      setFile(null);
      setSelectedCourseId("");
      setMessage("Material uploaded successfully.");
      await fetchProfessorData();
    }

    setUploading(false);
  };

  useEffect(() => {
    fetchProfessorData();
  }, []);

  return (
    <Layout>
      <div className="curriculum-container">
        <h2>Professor Curriculum</h2>

        {loading ? (
          <p className="loading">Loading curriculum...</p>
        ) : (
          <>
            <section className="curriculum-section">
              <div className="section-header">
                <h3>Upload Course Materials</h3>
                <span>{courses.length} courses</span>
              </div>

              <form className="material-form" onSubmit={uploadMaterial}>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} - {course["Course Code"]}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Material title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Material"}
                </button>
              </form>

              {message && <p className="form-message">{message}</p>}
            </section>

            <section className="curriculum-section">
              <div className="section-header">
                <h3>Uploaded Materials</h3>
                <span>{materials.length} materials</span>
              </div>

              <div className="materials-list">
                {materials.length === 0 ? (
                  <p className="no-results">No materials uploaded yet</p>
                ) : (
                  materials.map((item) => (
                    <div key={item.id} className="material-row">
                      <div>
                        <h4>{item.title}</h4>
                        <p>
                          {item.course?.name} {item.course?.["Course Code"]}
                        </p>
                      </div>

                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="material-btn"
                      >
                        Open
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

export default ProfessorCurriculum;
