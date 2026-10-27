package repository

import (
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"infinite-canvas/backend/internal/model"
)

// Preserve existing representations and make repair of an imported resource
// idempotent. A conflicting resource in the same immutable version is rejected.
func (r *Repository) EnsureImportedMediaRepresentation(input model.AssetRepresentation) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&model.AssetRepresentation{}).Where("asset_version_id = ? AND resource_id = ?", input.AssetVersionID, input.ResourceID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return nil
		}
		if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "asset_version_id"}, {Name: "role"}}, DoNothing: true}).Create(&input).Error; err != nil {
			return err
		}
		var actual model.AssetRepresentation
		if err := tx.Where("asset_version_id = ? AND role = ?", input.AssetVersionID, input.Role).First(&actual).Error; err != nil {
			return err
		}
		if actual.ResourceID != input.ResourceID {
			return fmt.Errorf("资产版本已有不同的原始媒体，拒绝覆盖")
		}
		return nil
	})
}
