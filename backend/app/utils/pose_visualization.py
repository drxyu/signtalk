"""
Pose Visualization for Debugging
Visualizes pose keypoints and connections for sign language analysis
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from typing import List, Dict, Optional, Tuple
import base64
from io import BytesIO
import json


class PoseVisualizer:
    """Visualize pose keypoints for debugging and analysis"""
    
    # Color scheme for different body parts
    COLORS = {
        'body': (0, 255, 0),      # Green
        'left_hand': (255, 0, 0),  # Red
        'right_hand': (0, 0, 255), # Blue
        'face': (255, 255, 0)      # Yellow
    }
    
    # Joint connections for visualization
    BODY_CONNECTIONS = [
        # Torso
        (11, 12), (11, 23), (12, 24), (23, 24),
        # Arms
        (11, 13), (13, 15), (12, 14), (14, 16),
        # Legs
        (23, 25), (25, 27), (27, 29), (29, 31),
        (24, 26), (26, 28), (28, 30), (30, 32),
        # Head
        (0, 1), (1, 2), (2, 3), (3, 7),
        (0, 4), (4, 5), (5, 6), (6, 8)
    ]
    
    def __init__(self):
        """Initialize pose visualizer"""
        self.figure = None
        self.axes = None
    
    def draw_skeleton_on_image(self, 
                              image: np.ndarray,
                              keypoints: np.ndarray,
                              connections: Optional[List[Tuple[int, int]]] = None,
                              confidence_threshold: float = 0.3) -> np.ndarray:
        """
        Draw skeleton on image
        
        Args:
            image: Input image
            keypoints: Keypoints array (N, 3) with x, y, confidence
            connections: List of joint connections
            confidence_threshold: Minimum confidence to draw
            
        Returns:
            Annotated image
        """
        annotated = image.copy()
        h, w = image.shape[:2]
        
        # Use default connections if not provided
        if connections is None:
            connections = self.BODY_CONNECTIONS
        
        # Draw connections
        for connection in connections:
            idx1, idx2 = connection
            
            if idx1 < len(keypoints) and idx2 < len(keypoints):
                kp1 = keypoints[idx1]
                kp2 = keypoints[idx2]
                
                # Check confidence
                if kp1[2] > confidence_threshold and kp2[2] > confidence_threshold:
                    pt1 = (int(kp1[0] * w), int(kp1[1] * h))
                    pt2 = (int(kp2[0] * w), int(kp2[1] * h))
                    
                    # Determine color based on joint index
                    if idx1 < 33:  # Body
                        color = self.COLORS['body']
                    elif idx1 < 54:  # Left hand
                        color = self.COLORS['left_hand']
                    elif idx1 < 75:  # Right hand
                        color = self.COLORS['right_hand']
                    else:  # Face
                        color = self.COLORS['face']
                    
                    cv2.line(annotated, pt1, pt2, color, 2)
        
        # Draw keypoints
        for idx, kp in enumerate(keypoints):
            if kp[2] > confidence_threshold:
                x = int(kp[0] * w)
                y = int(kp[1] * h)
                
                # Determine color
                if idx < 33:
                    color = self.COLORS['body']
                elif idx < 54:
                    color = self.COLORS['left_hand']
                elif idx < 75:
                    color = self.COLORS['right_hand']
                else:
                    color = self.COLORS['face']
                
                cv2.circle(annotated, (x, y), 4, color, -1)
                cv2.circle(annotated, (x, y), 5, (255, 255, 255), 1)
        
        return annotated
    
    def create_3d_plot(self, keypoints: np.ndarray) -> plt.Figure:
        """
        Create 3D plot of pose keypoints
        
        Args:
            keypoints: Keypoints array (N, 3)
            
        Returns:
            Matplotlib figure
        """
        fig = plt.figure(figsize=(10, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        # Plot keypoints
        valid_mask = keypoints[:, 2] > 0.3
        valid_kps = keypoints[valid_mask]
        
        if len(valid_kps) > 0:
            # Body keypoints
            body_mask = np.arange(len(keypoints)) < 33
            body_valid = valid_mask & body_mask
            if np.any(body_valid):
                body_kps = keypoints[body_valid]
                ax.scatter(body_kps[:, 0], body_kps[:, 1], body_kps[:, 2],
                          c='green', s=50, label='Body')
            
            # Hands
            left_hand_mask = (np.arange(len(keypoints)) >= 33) & (np.arange(len(keypoints)) < 54)
            left_valid = valid_mask & left_hand_mask
            if np.any(left_valid):
                left_kps = keypoints[left_valid]
                ax.scatter(left_kps[:, 0], left_kps[:, 1], left_kps[:, 2],
                          c='red', s=30, label='Left Hand')
            
            right_hand_mask = (np.arange(len(keypoints)) >= 54) & (np.arange(len(keypoints)) < 75)
            right_valid = valid_mask & right_hand_mask
            if np.any(right_valid):
                right_kps = keypoints[right_valid]
                ax.scatter(right_kps[:, 0], right_kps[:, 1], right_kps[:, 2],
                          c='blue', s=30, label='Right Hand')
        
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('3D Pose Visualization')
        ax.legend()
        
        # Set equal aspect ratio
        ax.set_box_aspect([1, 1, 1])
        
        return fig
    
    def create_pose_heatmap(self, 
                           pose_sequence: np.ndarray,
                           joint_names: Optional[List[str]] = None) -> plt.Figure:
        """
        Create heatmap showing joint movement over time
        
        Args:
            pose_sequence: Sequence of poses (T, N, 3)
            joint_names: Names of joints
            
        Returns:
            Matplotlib figure
        """
        seq_len, num_joints, _ = pose_sequence.shape
        
        # Calculate movement magnitude for each joint
        movement = np.zeros((num_joints, seq_len - 1))
        
        for t in range(seq_len - 1):
            diff = pose_sequence[t + 1] - pose_sequence[t]
            movement[:, t] = np.linalg.norm(diff, axis=1)
        
        # Create heatmap
        fig, ax = plt.subplots(figsize=(12, 8))
        
        im = ax.imshow(movement, aspect='auto', cmap='hot', interpolation='nearest')
        
        # Labels
        ax.set_xlabel('Time Frame')
        ax.set_ylabel('Joint Index')
        ax.set_title('Joint Movement Heatmap')
        
        # Add joint names if provided
        if joint_names and len(joint_names) == num_joints:
            ax.set_yticks(range(num_joints))
            ax.set_yticklabels(joint_names)
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Movement Magnitude')
        
        return fig
    
    def create_animation(self, 
                        frames: List[np.ndarray],
                        pose_sequence: np.ndarray,
                        fps: int = 10) -> FuncAnimation:
        """
        Create animation of pose sequence
        
        Args:
            frames: List of video frames
            pose_sequence: Pose keypoints sequence
            fps: Frames per second
            
        Returns:
            Matplotlib animation
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        
        # Initialize plots
        ax1.set_title('Original Frame')
        ax1.axis('off')
        ax2.set_title('Pose Skeleton')
        ax2.axis('off')
        
        # Initial frames
        im1 = ax1.imshow(cv2.cvtColor(frames[0], cv2.COLOR_BGR2RGB))
        annotated = self.draw_skeleton_on_image(frames[0], pose_sequence[0])
        im2 = ax2.imshow(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB))
        
        def update(frame_idx):
            # Update original frame
            im1.set_array(cv2.cvtColor(frames[frame_idx], cv2.COLOR_BGR2RGB))
            
            # Update skeleton
            annotated = self.draw_skeleton_on_image(frames[frame_idx], pose_sequence[frame_idx])
            im2.set_array(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB))
            
            return [im1, im2]
        
        anim = FuncAnimation(fig, update, frames=len(frames), 
                           interval=1000/fps, blit=True)
        
        return anim
    
    def generate_debug_report(self, 
                            pose_data: Dict,
                            image: Optional[np.ndarray] = None) -> Dict[str, any]:
        """
        Generate comprehensive debug report
        
        Args:
            pose_data: Pose extraction data
            image: Optional original image
            
        Returns:
            Debug report dictionary
        """
        report = {
            'timestamp': pose_data.get('timestamp', ''),
            'pose_detected': pose_data.get('pose_detected', False),
            'left_hand_detected': pose_data.get('left_hand_detected', False),
            'right_hand_detected': pose_data.get('right_hand_detected', False),
            'face_detected': pose_data.get('face_detected', False),
            'overall_confidence': pose_data.get('confidence', 0.0)
        }
        
        # Analyze keypoints
        keypoints = pose_data.get('keypoints', np.array([]))
        if keypoints.size > 0:
            # Count valid keypoints
            valid_mask = keypoints[:, 2] > 0.3
            report['valid_keypoints'] = int(np.sum(valid_mask))
            report['total_keypoints'] = len(keypoints)
            
            # Calculate center of mass
            if np.any(valid_mask):
                valid_kps = keypoints[valid_mask]
                center = np.mean(valid_kps[:, :2], axis=0)
                report['center_of_mass'] = center.tolist()
            
            # Check hand positions
            if len(keypoints) >= 75:
                # Left hand center (joints 33-53)
                left_hand = keypoints[33:54]
                left_valid = left_hand[:, 2] > 0.3
                if np.any(left_valid):
                    left_center = np.mean(left_hand[left_valid][:, :2], axis=0)
                    report['left_hand_center'] = left_center.tolist()
                
                # Right hand center (joints 54-74)
                right_hand = keypoints[54:75]
                right_valid = right_hand[:, 2] > 0.3
                if np.any(right_valid):
                    right_center = np.mean(right_hand[right_valid][:, :2], axis=0)
                    report['right_hand_center'] = right_center.tolist()
        
        # Generate visualization if image provided
        if image is not None and keypoints.size > 0:
            annotated = self.draw_skeleton_on_image(image, keypoints)
            
            # Convert to base64 for web display
            _, buffer = cv2.imencode('.jpg', annotated)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            report['visualization'] = f"data:image/jpeg;base64,{img_base64}"
        
        return report
    
    def save_visualization(self, 
                         image: np.ndarray,
                         keypoints: np.ndarray,
                         output_path: str):
        """
        Save visualization to file
        
        Args:
            image: Input image
            keypoints: Pose keypoints
            output_path: Output file path
        """
        annotated = self.draw_skeleton_on_image(image, keypoints)
        cv2.imwrite(output_path, annotated)
        
    def compare_poses(self, 
                     pose1: np.ndarray,
                     pose2: np.ndarray) -> float:
        """
        Compare two poses and return similarity score
        
        Args:
            pose1: First pose keypoints
            pose2: Second pose keypoints
            
        Returns:
            Similarity score (0-1)
        """
        # Find valid keypoints in both poses
        valid1 = pose1[:, 2] > 0.3
        valid2 = pose2[:, 2] > 0.3
        valid_both = valid1 & valid2
        
        if not np.any(valid_both):
            return 0.0
        
        # Compare valid keypoints
        kp1 = pose1[valid_both][:, :2]
        kp2 = pose2[valid_both][:, :2]
        
        # Normalize poses
        center1 = np.mean(kp1, axis=0)
        center2 = np.mean(kp2, axis=0)
        kp1_norm = kp1 - center1
        kp2_norm = kp2 - center2
        
        # Scale normalization
        scale1 = np.std(kp1_norm)
        scale2 = np.std(kp2_norm)
        if scale1 > 0 and scale2 > 0:
            kp1_norm /= scale1
            kp2_norm /= scale2
        
        # Calculate similarity
        distances = np.linalg.norm(kp1_norm - kp2_norm, axis=1)
        avg_distance = np.mean(distances)
        
        # Convert to similarity score
        similarity = np.exp(-avg_distance)
        
        return float(similarity)