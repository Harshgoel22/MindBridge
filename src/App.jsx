import { Suspense, lazy, useEffect } from "react"
import "./App.css"
// Redux
import { useDispatch, useSelector } from "react-redux"
// React Router
import { Route, Routes, useNavigate } from "react-router-dom"

// Components kept eager: small, needed on almost every route, or the
// landing page itself (no point lazy-loading the very first thing shown).
import Navbar from "./components/Common/Navbar"
import OpenRoute from "./components/core/Auth/OpenRoute"
import PrivateRoute from "./components/core/Auth/PrivateRoute"
import Home from "./pages/Home"
import { getUserDetails } from "./services/operations/profileAPI"
import { ACCOUNT_TYPE } from "./utils/constants"

// Everything else is code-split — each of these becomes its own JS chunk,
// only downloaded when the user actually navigates there, instead of all
// being bundled into the initial page load.
const About = lazy(() => import("./pages/About"))
const Contact = lazy(() => import("./pages/Contact"))
const CourseDetails = lazy(() => import("./pages/CourseDetails"))
const Catalog = lazy(() => import("./pages/Catalog"))
const Login = lazy(() => import("./pages/Login"))
const Signup = lazy(() => import("./pages/Signup"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"))
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"))
const Error = lazy(() => import("./pages/Error"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const ViewCourse = lazy(() => import("./pages/ViewCourse"))
const VideoDetails = lazy(() => import("./components/core/ViewCourse/VideoDetails"))
const MyProfile = lazy(() => import("./components/core/Dashboard/MyProfile"))
const Settings = lazy(() => import("./components/core/Dashboard/Settings"))
const Instructor = lazy(() => import("./components/core/Dashboard/Instructor"))
const MyCourses = lazy(() => import("./components/core/Dashboard/MyCourses"))
const AddCourse = lazy(() => import("./components/core/Dashboard/AddCourse"))
const EditCourse = lazy(() => import("./components/core/Dashboard/EditCourse"))
const EnrolledCourses = lazy(() => import("./components/core/Dashboard/EnrolledCourses"))
const Cart = lazy(() => import("./components/core/Dashboard/Cart"))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-richblack-600 border-t-yellow-50" />
    </div>
  )
}

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)

  useEffect(() => {
    if (localStorage.getItem("token")) {
      const token = JSON.parse(localStorage.getItem("token"))
      dispatch(getUserDetails(token, navigate))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen w-screen flex-col bg-richblack-900 font-inter">
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="courses/:courseId" element={<CourseDetails />} />
          <Route path="catalog/:catalogName" element={<Catalog />} />

          {/* Open Route - for Only Non Logged in User */}
          <Route
            path="login"
            element={
              <OpenRoute>
                <Login />
              </OpenRoute>
            }
          />
          <Route
            path="forgot-password"
            element={
              <OpenRoute>
                <ForgotPassword />
              </OpenRoute>
            }
          />
          <Route
            path="update-password/:id"
            element={
              <OpenRoute>
                <UpdatePassword />
              </OpenRoute>
            }
          />
          <Route
            path="signup"
            element={
              <OpenRoute>
                <Signup />
              </OpenRoute>
            }
          />
          <Route
            path="verify-email"
            element={
              <OpenRoute>
                <VerifyEmail />
              </OpenRoute>
            }
          />
          {/* Private Route - for Only Logged in User */}
          <Route
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            {/* Route for all users */}
            <Route path="dashboard/my-profile" element={<MyProfile />} />
            <Route path="dashboard/Settings" element={<Settings />} />

            {/* Route only for Instructors */}
            {user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
              <>
                <Route path="dashboard/instructor" element={<Instructor />} />
                <Route path="dashboard/my-courses" element={<MyCourses />} />
                <Route path="dashboard/add-course" element={<AddCourse />} />
                <Route
                  path="dashboard/edit-course/:courseId"
                  element={<EditCourse />}
                />
              </>
            )}
            {/* Route only for Students */}
            {user?.accountType === ACCOUNT_TYPE.STUDENT && (
              <>
                <Route
                  path="dashboard/enrolled-courses"
                  element={<EnrolledCourses />}
                />
                <Route path="/dashboard/cart" element={<Cart />} />
              </>
            )}
            <Route path="dashboard/settings" element={<Settings />} />
          </Route>

          {/* For the watching course lectures */}
          <Route
            element={
              <PrivateRoute>
                <ViewCourse />
              </PrivateRoute>
            }
          >
            {user?.accountType === ACCOUNT_TYPE.STUDENT && (
              <>
                <Route
                  path="view-course/:courseId/section/:sectionId/sub-section/:subSectionId"
                  element={<VideoDetails />}
                />
              </>
            )}
          </Route>

          {/* 404 Page */}
          <Route path="*" element={<Error />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App