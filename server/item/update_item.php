<?php
require "../config/database.php";

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    $item_id = intval($_POST['item_id']);
    $title = $_POST['item_name'];
    $description = $_POST['description'];
    $category_type = $_POST['category'];
    $status = $_POST['status'];

    $starting_price = $_POST['starting_price'];
    $start_date = $_POST['start_date'];
    $end_date = $_POST['end_date'];

    //Update 'item' Table
    $sql_item ="UPDATE item
                SET title=?, description=?, category_type=?, status=?
                WHERE item_id=?";
    $stmt_item = $conn->prepare($sql_item);
    $stmt_item->bind_param("ssssi", $title, $description, $category_type, $status, $item_id);
    $stmt_item->execute();

    //Update 'biditem' Table
    $sql_bid = "UPDATE biditem
                SET starting_price=?, start_date=?, end_date=?
                WHERE item_id=?";
    $stmt_bid = $conn->prepare($sql_bid);
    $stmt_bid->bind_param("dssi", $starting_price, $start_date, $end_date, $item_id);
    $stmt_bid->execute();

    //Image Appending
    if(!empty($_FILES['images']['name'][0])){
        $uploadDir = "../server/item/uploads/";

        foreach ($_FILES['images']['name'] as $key => $name){
            if($_FILES['images']['error'][$key] === UPLOAD_ERR_OK){
                $tmp = $_FILES['images']['tmp_name'][$key];

                $newName = time() . "_" . basename($name);
                $savePath = $uploadDir . $newName;
                
                if (move_uploaded_file($tmp, $savePath)) {
                    $sql_img = "INSERT INTO itemimage (image_path, item_id) VALUES (?, ?)";
                    $stmt_img = $conn->prepare($sql_img);
                    $stmt_img->bind_param("si", $savePath, $item_id);
                    $stmt_img->execute();
                    $stmt_img->close();
                }
            }
        }
    }

    echo "<h2>Item Updated Successfully!</h2>";
    echo "<a href='get_item_single.php?id=$item_id'>Back to Edit</a>";
}
