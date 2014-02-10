# ##### BEGIN GPL LICENSE BLOCK #####
#
#    This program is free software; you can redistribute it and/or
#    modify it under the terms of the GNU General Public License
#    as published by the Free Software Foundation; either version 2
#    of the License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.    See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program; if not, write to the Free Software Foundation,
#    Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
#
# ##### END GPL LICENSE BLOCK #####

import os
import re
import time

import bpy
import mathutils
import bpy_extras.io_utils

def _getName( object ):
    return re.sub( '[^a-zA-Z0-9_]+', '', re.sub( '[\. ]','_', object.data.name ))

# output an object
def _write_mesh( fw, object, mesh, EXPORT_NORMALS ):
    objectName = _getName(object)

    if ( EXPORT_NORMALS ):
      print("exporting normals")
      bpy.ops.object.shade_smooth()
    else:
      print("not exporting normals")

    # if an object has geometry, export them
    if (len(mesh.polygons) + len(mesh.vertices)):
        # drop our geometry
        fw("{\"name\": \"%s\",\n" % objectName)
        fw("\"ibo\": [\n")
        for index, face in enumerate(mesh.polygons):
            face_verts = face.vertices
            if index != 0:
                fw(',')
            # fan triangulate
            for i in range(2, len(face_verts), 1):
                if i>2:
                    fw(",")
                fw("%d,%d,%d" % (face_verts[i],face_verts[i-1],face_verts[0]))
        fw("],\n")
        # our vbo stride
        fw("\"stride\": ")
        if ( EXPORT_NORMALS ):
          fw("3,")
        else:
          fw("6,")
        # drop our vert positions
        fw("\"vbo\": [")
        for vertex in mesh.vertices:
            if vertex.index != 0:
                fw(",")
            if ( EXPORT_NORMALS ):
                fw("\n%f,%f,%f,%f,%f,%f" % (vertex.co.x,vertex.co.y,vertex.co.z,vertex.normal.x,vertex.normal.y,vertex.normal.z))
            else:
                fw("\n%f,%f,%f" % (vertex.co.x,vertex.co.y,vertex.co.z))
        fw("]")
        fw("}\n")
    else:
        print("ERROR: tried to export a mesh without sufficient verts!")


def _write(context, filepath, EXPORT_APPLY_MODIFIERS, EXPORT_NORMALS):

    time1 = time.time() # profile how long we take
    print("saving to file: %s" % filepath)
    file = open(filepath, "w", encoding="utf8", newline="\n")
    filename_prefix=re.sub(
            '[\. ]','_'
            ,os.path.splitext( os.path.basename( file.name ) )[0]
            )
    fw = file.write

    # get this [party] started
    fw("[\n")

    scene = context.scene
    # Exit edit mode before exporting, so current object states are exported properly.
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode='OBJECT')
    for object in context.selected_objects:

        # EXPORT THE SHAPES.
        if object.type=='MESH':
            _write_mesh(fw, object, object.to_mesh(scene, EXPORT_APPLY_MODIFIERS, 'PREVIEW'), EXPORT_NORMALS )

    # we're done here
    fw("]")
    file.close()
    print("JSON Export time: %.2f" % (time.time() - time1))
 
def save(operator, context, filepath="",
                 apply_modifiers=True,
                 export_normals=True,
                 ):

    _write(context, filepath,
                 EXPORT_APPLY_MODIFIERS=apply_modifiers,
                 EXPORT_NORMALS=export_normals,
                 )

    return {'FINISHED'}
