import { z } from "zod";
export declare const toolNames: readonly ["runtime_diagnostics", "skill_catalog", "skill_search", "skill_read", "skill_prepare", "canvas_get_state", "canvas_get_drawing", "canvas_update_drawing", "canvas_update_tldraw_drawing", "canvas_get_capabilities", "canvas_list_open_canvases", "canvas_layout_nodes", "canvas_undo_agent_ops", "canvas_redo_agent_ops", "canvas_duplicate_node", "canvas_toggle_node_locked", "canvas_toggle_frame_collapsed", "canvas_insert_asset", "canvas_replace_node_media", "canvas_get_timeline", "canvas_apply_timeline_operation", "canvas_render_timeline", "canvas_upload_file", "canvas_crop_image", "canvas_split_image", "canvas_upscale_image", "canvas_extract_video_frames", "canvas_extract_video_audio", "canvas_trim_video", "canvas_batch_table_read", "canvas_batch_table_add_row", "canvas_batch_table_update_row", "canvas_batch_table_remove_row", "canvas_batch_table_add_reference_column", "canvas_batch_table_remove_reference_column", "canvas_batch_table_reorder_reference_columns", "canvas_batch_table_move_reference_cell", "canvas_batch_table_sync_rows_from_connections", "canvas_edit_reference", "canvas_preflight_batch_rows", "canvas_generate_batch_rows", "canvas_create_local_folder", "canvas_create_storyboard_group", "canvas_create_reference_group", "canvas_move_nodes_to_frame", "canvas_list_projects", "canvas_export_projects", "canvas_import_project_archive", "canvas_get_context", "canvas_find_nodes", "canvas_find_available_assets", "canvas_preflight_storyboard_media", "canvas_generate_storyboard_media", "canvas_get_node", "canvas_get_connection", "canvas_get_generation_tasks", "canvas_get_resources", "canvas_validate_ops", "canvas_get_selection", "canvas_export_snapshot", "canvas_get_storyboard", "canvas_update_storyboard", "canvas_apply_ops", "canvas_create_workflow", "canvas_create_node", "canvas_create_storyboard_image_nodes", "canvas_create_storyboard_video_nodes", "canvas_generate_storyboard_rows", "canvas_create_text_node", "canvas_create_text_nodes", "canvas_create_image_prompt_flow", "canvas_create_generation_flow", "canvas_generate_text", "canvas_generate_image", "canvas_generate_video", "canvas_generate_audio", "canvas_update_node", "canvas_update_node_text", "canvas_move_nodes", "canvas_resize_node", "canvas_delete_nodes", "canvas_connect_nodes", "canvas_select_nodes", "canvas_set_viewport", "canvas_run_generation", "canvas_merge_videos", "canvas_list_director_scenes", "canvas_get_director_scene", "canvas_create_director_shot", "canvas_update_director_scene", "canvas_update_director_shot", "canvas_add_director_camera", "canvas_update_director_camera", "canvas_delete_director_camera", "canvas_add_director_light", "canvas_update_director_light", "canvas_delete_director_light", "canvas_add_director_object", "canvas_update_director_object", "canvas_delete_director_object", "canvas_upsert_director_keyframe", "canvas_delete_director_keyframe", "canvas_upsert_director_bone_keyframe", "canvas_delete_director_bone_keyframe", "project_get_context", "project_list_units", "project_extract_asset_candidates", "project_confirm_asset_candidate", "project_create_or_update_shots", "project_link_shot_asset", "project_start_workflow_step", "project_link_asset", "project_upsert_asset_version", "project_register_task_output", "film_list_operations", "film_list_models", "film_validate_strategy", "film_create_run", "film_get_run", "film_update_plan", "film_pause_run", "film_resume_run", "film_cancel_run", "film_submit_step", "film_probe_media", "film_check_shot", "film_record_step_result", "film_render_timeline", "film_verify_delivery", "film_run_operation", "film_get_tasks", "film_wait_task"];
export type ToolName = (typeof toolNames)[number];
export declare const canvasOpSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"add_node">;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"add_node">;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"add_node">;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"update_node">;
    id: z.ZodString;
    patch: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"update_node">;
    id: z.ZodString;
    patch: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"update_node">;
    id: z.ZodString;
    patch: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"delete_node">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"delete_node">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"delete_node">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nodeType: z.ZodOptional<z.ZodEnum<["image", "text", "script", "video", "audio", "frame"]>>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"delete_connections">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    all: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"delete_connections">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    all: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"delete_connections">;
    id: z.ZodOptional<z.ZodString>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    all: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"connect_nodes">;
    id: z.ZodOptional<z.ZodString>;
    fromNodeId: z.ZodString;
    toNodeId: z.ZodString;
    fromHandleId: z.ZodOptional<z.ZodString>;
    toHandleId: z.ZodOptional<z.ZodString>;
    relation: z.ZodOptional<z.ZodEnum<["storyboard-output", "storyboard-asset-reference", "batch-output"]>>;
    storyboardRowId: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"connect_nodes">;
    id: z.ZodOptional<z.ZodString>;
    fromNodeId: z.ZodString;
    toNodeId: z.ZodString;
    fromHandleId: z.ZodOptional<z.ZodString>;
    toHandleId: z.ZodOptional<z.ZodString>;
    relation: z.ZodOptional<z.ZodEnum<["storyboard-output", "storyboard-asset-reference", "batch-output"]>>;
    storyboardRowId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"connect_nodes">;
    id: z.ZodOptional<z.ZodString>;
    fromNodeId: z.ZodString;
    toNodeId: z.ZodString;
    fromHandleId: z.ZodOptional<z.ZodString>;
    toHandleId: z.ZodOptional<z.ZodString>;
    relation: z.ZodOptional<z.ZodEnum<["storyboard-output", "storyboard-asset-reference", "batch-output"]>>;
    storyboardRowId: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"set_viewport">;
    viewport: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        k: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        k: number;
    }, {
        x: number;
        y: number;
        k: number;
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"set_viewport">;
    viewport: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        k: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        k: number;
    }, {
        x: number;
        y: number;
        k: number;
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"set_viewport">;
    viewport: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        k: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        k: number;
    }, {
        x: number;
        y: number;
        k: number;
    }>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"select_nodes">;
    ids: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"select_nodes">;
    ids: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"select_nodes">;
    ids: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    type: z.ZodLiteral<"run_generation">;
    nodeId: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["text", "image", "video", "audio"]>>;
    prompt: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodLiteral<"run_generation">;
    nodeId: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["text", "image", "video", "audio"]>>;
    prompt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodLiteral<"run_generation">;
    nodeId: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["text", "image", "video", "audio"]>>;
    prompt: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const toolInputSchemas: Record<ToolName, z.AnyZodObject>;
export declare const toolDescriptions: Record<ToolName, string>;
