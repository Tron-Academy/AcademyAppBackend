import { NotFoundError } from "../errors/customErrors.js";
import Video from "../models/VideoModel.js";
import Module from "../models/ModuleModel.js";

export const addVideo = async (req, res) => {
  const { videoName, videoURL, relatedModule, relatedCourse } = req.body;
  const newVideo = new Video({
    videoName: videoName,
    videoURL: videoURL,
    relatedModule: relatedModule,
    relatedCourse: relatedCourse,
  });
  await newVideo.save();

  const module = await Module.findById(relatedModule);
  if (!module) throw new NotFoundError("modules not found");
  module.AllVideos.push(newVideo._id);
  await module.save();

  res.status(201).json({ message: "successfully created" });
};

export const getAllVideo = async (req, res) => {
  const videos = await Video.find();
  if (!videos) throw new NotFoundError("videos not found");
  res.status(200).json(videos);
};

export const updateVideos = async (req, res) => {
  const { videoName, videoURL, relatedModule, relatedCourse } = req.body;
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) throw new NotFoundError("videos not found");
  video.videoName = videoName;
  video.videoURL = videoURL;
  video.relatedModule = relatedModule;
  video.relatedCourse = relatedCourse;
  await video.save();
  res.status(200).json({ message: "successfully updated" });
};

export const getSingleVideo = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) throw new NotFoundError("videos not found");
  res.status(200).json(video);
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) throw new NotFoundError("No video found");
  const module = await Module.findById(video.relatedModule);
  if (!module) throw new NotFoundError("No Module found");
  const allVideos = module.AllVideos;
  const newVideos = allVideos.filter(
    (video) => video.toString() !== video._id.toString()
  );
  module.AllVideos = newVideos;
  await module.save();
  await Video.findByIdAndDelete(id);
  res.status(200).json({ msg: "Video has successfully deleted" });
};

export const getVideoByCourse = async (req, res) => {
  //we are passing the courseId through query
  const { courseId } = req.query;
  const videos = await Video.find({ relatedCourse: courseId }); //we are filtering all the videos related to course,
  if (!videos) throw new NotFoundError("videos not found");
  res.status(200).json(videos);
};

export const getVideoByModule = async (req, res) => {
  const { moduleId } = req.query;
  const videos = await Video.find({ relatedModule: moduleId });
  if (!videos) throw new NotFoundError("videos not found ");
  res.status(200).json(videos);
};
