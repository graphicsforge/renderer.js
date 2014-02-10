# ##### BEGIN GPL LICENSE BLOCK #####
#
#  This program is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License
#  as published by the Free Software Foundation; either version 2
#  of the License, or (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software Foundation,
#  Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
#
# ##### END GPL LICENSE BLOCK #####

# <pep8-80 compliant>

bl_info = {
    "name": "json Exporter (.json)",
    "author": "Peter Yee (GraphicsForge)",
    "version": (0, 1),
    "blender": (2, 6, 9),
    "location": "File > Import-Export > json",
    "description": "Output a mesh into a format for webGL",
    "warning": "",
    "wiki_url": "https://github.com/graphicsforge/renderer.js/wiki",
    "tracker_url": "https://github.com/graphicsforge/renderer.js",
    "support": 'COMMUNITY',
    "category": "Import-Export"}

"""
Export JSON files
"""

if "bpy" in locals():
  import imp
  if "export_json" in locals():
    imp.reload(export_json)

import os
import bpy
from bpy.props import StringProperty, BoolProperty, CollectionProperty
from bpy_extras.io_utils import ExportHelper, ImportHelper
from bpy.types import Operator, OperatorFileListElement


class ExportJSON(Operator, ExportHelper):
  """Save vertex array data from the active object"""
  bl_idname = "export_mesh.json"
  bl_label = "Export JSON"

  filename_ext = ".json"
  filter_glob = StringProperty(default="*.json", options={'HIDDEN'})

  apply_modifiers = BoolProperty(name="Apply Modifiers",
                   description="Apply the modifiers first",
                   default=True)

  export_normals = BoolProperty(name="Export Normals",
                   description="Also give normal information",
                   default=True)

  def execute(self, context):
    from . import export_json
    from mathutils import Matrix

    keywords = self.as_keywords(ignore=("check_existing",
                                        "filter_glob",
                                        ))

    return export_json.save(self, context, **keywords)


def menu_export(self, context):
  default_path = os.path.splitext(bpy.data.filepath)[0] + ".json"
  self.layout.operator(ExportJSON.bl_idname, text="json (.json)")


def register():
  bpy.utils.register_module(__name__)
  bpy.types.INFO_MT_file_export.append(menu_export)


def unregister():
  bpy.utils.unregister_module(__name__)
  bpy.types.INFO_MT_file_export.remove(menu_export)


if __name__ == "__main__":
  register()
