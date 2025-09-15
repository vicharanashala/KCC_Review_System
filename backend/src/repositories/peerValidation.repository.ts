import PeerValidation from '../models/peerValidation.model';
import { IPeerValidation } from '../interfaces/peerValidation.interface';

export default class PeerValidationRepository {
  async create(peerValidationData: Partial<IPeerValidation>): Promise<IPeerValidation> {
    return PeerValidation.create(peerValidationData);
  }

  async findByPeerValidationId(peerValidationId: string): Promise<IPeerValidation | null> {
    return PeerValidation.findOne({ peer_validation_id: peerValidationId }).populate('answer reviewer');
  }

  async findByAnswerId(answerId: string): Promise<IPeerValidation[]> {
    return PeerValidation.find({ answer_id: answerId }).populate('answer reviewer').sort({ created_at: -1 });
  }

  async findLastByAnswerId(answerId: string): Promise<IPeerValidation | null> {
    return PeerValidation.findOne({ answer_id: answerId }).sort({ created_at: -1 }).populate('answer reviewer');
  }
}