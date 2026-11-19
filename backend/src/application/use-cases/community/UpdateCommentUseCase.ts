import { CommentRepository } from '../../../infrastructure/database/repositories/CommentRepository';
import { UserRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { ProfileRepository } from '../../../infrastructure/database/repositories/ProfileRepository';

export interface UpdateCommentRequest {
    commentId: string;
    userId: string;
    content: string;
}

export class UpdateCommentUseCase {
    constructor(
        private commentRepository: CommentRepository,
        private userRepository: UserRepository,
        private profileRepository: ProfileRepository
    ) { }

    async execute(request: UpdateCommentRequest): Promise<any> {
        const { commentId, userId, content } = request;

        if (!content || content.trim().length === 0) {
            throw new Error("Comment content is required");
        }


        const existingComment = await this.commentRepository.findById(commentId);

        if (!existingComment) {
            throw new Error("Comment not found");
        }

        if (existingComment.userId !== userId) {
            throw new Error("You can only edit your own comments");
        }

        // Update the comment
        existingComment.content = content.trim();
        existingComment.updatedAt = new Date();

        const updatedComment = await this.commentRepository.update(existingComment);

        // Enrich with author information
        const user = await this.userRepository.findById(updatedComment.userId);
        const profile = await this.profileRepository.findByUserId(updatedComment.userId);

        updatedComment.author = {
            userId: updatedComment.userId,
            name: profile?.name || 'メンバー',
            email: '',
            avatar: '',
        };

        // Include replies for parent comments
        if (updatedComment.parentCommentId === null || updatedComment.parentCommentId === undefined) {
            const replies = await this.commentRepository.findReplies(commentId);

            const enrichedReplies = await Promise.all(
                replies.map(async (reply) => {
                    const replyUser = await this.userRepository.findById(reply.userId);
                    const replyProfile = await this.profileRepository.findByUserId(reply.userId);

                    reply.author = {
                        userId: reply.userId,
                        name: replyProfile?.name || 'メンバー',
                        email: '',
                        avatar: '',
                    };

                    return reply;
                })
            );

            updatedComment.replies = enrichedReplies;
        }

        return updatedComment;
    }
}